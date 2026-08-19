import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DashboardData, GoalStats, Milestone } from '../../core/models';
import { goalDeleteConfirmText } from '../../core/goal-delete-confirm';
import { DashboardService } from '../../core/services/dashboard.service';
import { GoalService } from '../../core/services/goal.service';
import { MilestoneService } from '../../core/services/milestone.service';
import { validateDayOfMonth } from '../../core/validation';
import { WeekChartComponent } from '../../shared/week-chart';

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, FormsModule, WeekChartComponent],
  template: `
    <div class="page">
      <h2>Dashboard</h2>

      @if (loading()) {
        <p class="loading">Lädt…</p>
      } @else if (data()) {
        @if (data()!.active_session) {
          <div class="alert alert-info">
            ▶ Aktive Session: <strong>{{ data()!.active_session!.goal_title }}</strong> läuft gerade.
            <a routerLink="/timer" class="btn btn-sm btn-secondary" style="margin-left:1rem">Zum Timer</a>
          </div>
        }

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Geplant {{ monthLabel() }}</div>
            <div class="stat-value">{{ formatMinutes(data()!.current_month.planned_minutes) }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Ungestört gelernt {{ monthLabel() }}</div>
            <div class="stat-value">{{ formatMinutes(data()!.current_month.actual_minutes) }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pausen {{ monthLabel() }}</div>
            <div class="stat-value">{{ formatMinutes(data()!.current_month.paused_minutes) }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Geschafft</div>
            <div class="stat-value">{{ achievementPct() }}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Zwischenziele {{ monthLabel() }}</div>
            <div class="stat-value">{{ data()!.milestones.done }} / {{ data()!.milestones.total }}</div>
          </div>
        </div>

        <div class="month-progress card">
          <h3>Dein Fortschritt im {{ monthLabel() }}</h3>
          @if (data()!.current_month.planned_minutes === 0) {
            <p class="empty">Noch keine Lernzeiten für diesen Monat geplant. <a routerLink="/planning">Jetzt planen →</a></p>
          } @else {
            <div class="progress-bar-wrap">
              <div class="progress-bar" [style.width.%]="Math.min(achievementPct(), 100)"></div>
            </div>
            <div class="progress-label">
              {{ formatMinutes(data()!.current_month.actual_minutes) }} gelernt von
              {{ formatMinutes(data()!.current_month.planned_minutes) }} geplant
            </div>
          }
        </div>

        <app-week-chart [history]="data()!.weekly_history" />

        <div class="goals-section">
          <div class="section-header">
            <h3>Lernziele</h3>
            <a routerLink="/goals" class="btn btn-sm btn-primary">+ Neues Lernziel erstellen</a>
          </div>
          @if (data()!.goals.length === 0) {
            <p class="empty">Noch keine Lernziele. <a routerLink="/goals">Erstelle dein erstes Ziel.</a></p>
          }
          @for (goal of data()!.goals; track goal.id) {
            <div class="card goal-progress-card">
              <div class="goal-progress-header">
                <div>
                  <strong>{{ goal.title }}</strong>
                  <span class="module-tag">{{ goal.module_name }}</span>
                </div>
                <span class="status-badge" [class]="'status-' + goal.status">{{ statusLabel(goal.status) }}</span>
              </div>
              <div class="progress-bar-wrap">
                <div class="progress-bar" [class]="progressClass(goal)"
                  [style.width.%]="Math.min(goalPct(goal), 100)">
                </div>
              </div>
              <div class="progress-label">
                {{ formatMinutes(goal.total_actual_minutes) }} gelernt von
                {{ formatMinutes(goal.planned_ects_minutes) }} gesamt ({{ goalPct(goal) }}%)
              </div>
              @if (goal.weekly_budget_minutes > 0) {
                <div class="progress-label">Budget: {{ formatMinutes(goal.weekly_budget_minutes) }}/Woche</div>
              }
              <div class="goal-actions">
                <a class="btn btn-sm btn-secondary" [routerLink]="['/goals']" [queryParams]="{ edit: goal.id }">✎ Bearbeiten</a>
                @if (goal.status !== 'achieved') {
                  <button class="btn btn-sm btn-success" (click)="markAchieved(goal)">✓ Erreicht</button>
                  @if (goal.status === 'open') {
                    <button class="btn btn-sm btn-secondary" (click)="markInProgress(goal)">▶ In Arbeit</button>
                  }
                }
                <button class="btn btn-sm btn-danger" (click)="remove(goal)">🗑 Löschen</button>
              </div>
              <div class="subgoals" style="margin-top: 0.5rem">
                @for (m of goal.milestones; track m.id) {
                  <div class="milestone-row">
                    <label class="milestone-check">
                      <input type="checkbox" [checked]="m.done" (change)="toggleSubgoal(goal, m)" />
                      <span [class.milestone-done]="m.done">{{ m.title }}</span>
                    </label>
                    @if (m.due_day) {
                      <span class="milestone-due">bis {{ m.due_day }}.</span>
                    }
                    <button class="btn btn-sm btn-danger" (click)="removeSubgoal(goal, m)">Löschen</button>
                  </div>
                }
                @if (addingSubgoalId() === goal.id) {
                  <div class="form-row">
                    <div class="form-group">
                      <label [for]="'subgoal-title-' + goal.id">Neues Unterziel</label>
                      <input [id]="'subgoal-title-' + goal.id" [(ngModel)]="newSubgoalTitle"
                        [name]="'subgoal_title_' + goal.id"
                        (ngModelChange)="clearSubgoalFieldError('title')"
                        [class.input-error]="subgoalErrors()['title']"
                        placeholder="z.B. Kapitel 3 abschließen" />
                      @if (subgoalErrors()['title']) {
                        <p class="field-error">{{ subgoalErrors()['title'] }}</p>
                      }
                    </div>
                    <div class="form-group">
                      <label [for]="'subgoal-day-' + goal.id">Bis Tag (optional)</label>
                      <input [id]="'subgoal-day-' + goal.id" type="number" [(ngModel)]="newSubgoalDay"
                        [name]="'subgoal_day_' + goal.id"
                        (ngModelChange)="clearSubgoalFieldError('day')"
                        [class.input-error]="subgoalErrors()['day']" min="1" max="31" placeholder="z.B. 15" />
                      @if (subgoalErrors()['day']) {
                        <p class="field-error">{{ subgoalErrors()['day'] }}</p>
                      }
                    </div>
                  </div>
                  @if (subgoalErrors()['general']) {
                    <p class="field-error">{{ subgoalErrors()['general'] }}</p>
                  }
                  <div class="goal-actions">
                    <button class="btn btn-sm btn-primary" (click)="addSubgoal(goal)">Speichern</button>
                    <button class="btn btn-sm btn-secondary" (click)="toggleAddSubgoal(goal.id)">Abbrechen</button>
                  </div>
                } @else {
                  <button class="btn btn-sm btn-secondary" (click)="toggleAddSubgoal(goal.id)">+ Unterziel</button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private goalService = inject(GoalService);
  private milestoneService = inject(MilestoneService);

  data = signal<DashboardData | null>(null);
  loading = signal(true);
  protected Math = Math;

  /** id des Ziels, dessen "+ Unterziel"-Formular gerade offen ist; null heisst: keins. */
  addingSubgoalId = signal<number | null>(null);
  newSubgoalTitle = '';
  newSubgoalDay: number | null = null;
  subgoalErrors = signal<Record<string, string>>({});

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  private async reload(): Promise<void> {
    try {
      const data = await this.dashboardService.get();
      this.data.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  async markAchieved(goal: GoalStats): Promise<void> {
    await this.goalService.update(goal.id, { status: 'achieved' });
    await this.reload();
  }

  async markInProgress(goal: GoalStats): Promise<void> {
    await this.goalService.update(goal.id, { status: 'in_progress' });
    await this.reload();
  }

  async remove(goal: GoalStats): Promise<void> {
    if (!confirm(goalDeleteConfirmText(goal.title))) return;
    await this.goalService.delete(goal.id);
    await this.reload();
  }

  /** Toggelt "+ Unterziel"-Formular fuer eine Karte auf/zu und setzt die Felder zurueck. */
  toggleAddSubgoal(goalId: number): void {
    if (this.addingSubgoalId() === goalId) {
      this.addingSubgoalId.set(null);
      return;
    }
    this.newSubgoalTitle = '';
    this.newSubgoalDay = null;
    this.subgoalErrors.set({});
    this.addingSubgoalId.set(goalId);
  }

  /** Loescht die Fehlermeldung eines Unterziel-Formularfeldes, sobald der Wert geaendert wird. */
  clearSubgoalFieldError(field: string): void {
    this.subgoalErrors.update((errors) => {
      if (!errors[field]) return errors;
      const rest = { ...errors };
      delete rest[field];
      return rest;
    });
  }

  async toggleSubgoal(goal: GoalStats, milestone: Milestone): Promise<void> {
    const updated = await this.milestoneService.update(milestone.id, { done: !milestone.done });
    this.data.update((d) => {
      if (!d) return d;
      const doneDelta = updated.done ? 1 : -1;
      return {
        ...d,
        goals: d.goals.map((g) =>
          g.id === goal.id
            ? { ...g, milestones: g.milestones.map((m) => (m.id === milestone.id ? updated : m)) }
            : g,
        ),
        milestones: { ...d.milestones, done: d.milestones.done + doneDelta },
      };
    });
  }

  async removeSubgoal(goal: GoalStats, milestone: Milestone): Promise<void> {
    await this.milestoneService.delete(milestone.id);
    this.data.update((d) => {
      if (!d) return d;
      return {
        ...d,
        goals: d.goals.map((g) =>
          g.id === goal.id
            ? { ...g, milestones: g.milestones.filter((m) => m.id !== milestone.id) }
            : g,
        ),
        milestones: {
          done: d.milestones.done - (milestone.done ? 1 : 0),
          total: d.milestones.total - 1,
        },
      };
    });
  }

  async addSubgoal(goal: GoalStats): Promise<void> {
    const d = this.data();
    if (!d) return;
    const title = this.newSubgoalTitle.trim();
    const { year, month } = d.current_month;

    const errors: Record<string, string> = {};
    if (!title) {
      errors['title'] = 'Bitte einen Titel angeben.';
    } else if (title.length > 200) {
      errors['title'] = 'Titel darf höchstens 200 Zeichen lang sein.';
    }
    const dayError = validateDayOfMonth(this.newSubgoalDay, year, month);
    if (dayError) errors['day'] = dayError;
    this.subgoalErrors.set(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const created = await this.milestoneService.create({
        title,
        goal_id: goal.id,
        year,
        month,
        due_day: this.newSubgoalDay ?? null,
      });
      this.data.update((cur) => {
        if (!cur) return cur;
        return {
          ...cur,
          goals: cur.goals.map((g) =>
            g.id === goal.id ? { ...g, milestones: [...g.milestones, created] } : g,
          ),
          milestones: { ...cur.milestones, total: cur.milestones.total + 1 },
        };
      });
      this.newSubgoalTitle = '';
      this.newSubgoalDay = null;
      this.addingSubgoalId.set(null);
    } catch (err) {
      const msg = err instanceof HttpErrorResponse ? err.error?.error : undefined;
      this.subgoalErrors.set({ general: msg ?? 'Fehler beim Speichern.' });
    }
  }

  monthLabel(): string {
    const d = this.data();
    if (!d) return '';
    return MONTH_NAMES[d.current_month.month - 1];
  }

  achievementPct(): number {
    const d = this.data();
    if (!d || d.current_month.planned_minutes === 0) return 0;
    return Math.round((d.current_month.actual_minutes / d.current_month.planned_minutes) * 100);
  }

  goalPct(goal: GoalStats): number {
    if (goal.planned_ects_minutes === 0) return 0;
    return Math.round((goal.total_actual_minutes / goal.planned_ects_minutes) * 100);
  }

  progressClass(goal: GoalStats): string {
    const pct = this.goalPct(goal);
    if (pct >= 100) return 'progress-done';
    if (pct >= 50) return 'progress-mid';
    return 'progress-low';
  }

  formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  statusLabel(status: string): string {
    return { open: 'Offen', in_progress: 'In Arbeit', achieved: 'Erreicht' }[status] ?? status;
  }
}

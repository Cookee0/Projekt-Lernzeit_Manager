import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardData, GoalStats } from '../../core/models';
import { DashboardService } from '../../core/services/dashboard.service';

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="page">
      <h2>Dashboard</h2>

      @if (loading()) {
        <p class="loading">Lädt…</p>
      } @else if (data()) {
        @if (data()!.reminder_text) {
          <div class="alert alert-warning">
            ⚠️ {{ data()!.reminder_text }}
            <a routerLink="/timer" class="btn btn-sm btn-primary" style="margin-left:1rem">Timer starten</a>
          </div>
        }

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
            <div class="stat-label">Gelernt {{ monthLabel() }}</div>
            <div class="stat-value">{{ formatMinutes(data()!.current_month.actual_minutes) }}</div>
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
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  data = signal<DashboardData | null>(null);
  loading = signal(true);
  protected Math = Math;

  async ngOnInit(): Promise<void> {
    try {
      this.data.set(await this.dashboardService.get());
    } finally {
      this.loading.set(false);
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

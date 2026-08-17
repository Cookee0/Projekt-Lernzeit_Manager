import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardData, DeadlineWarning, GoalStats } from '../../core/models';
import { DashboardService } from '../../core/services/dashboard.service';
import { PlanService } from '../../core/services/plan.service';
import { upcomingSlotReminder } from '../../core/upcoming-slot';

/** Ein Balken des Wochendiagramms (FR-6.3), Koordinaten im SVG-Raster. */
interface WeekBar {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  minutes: number;
  showValue: boolean;
}

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

        @for (warning of data()!.deadline_warnings; track warning.goal_id) {
          <div class="alert alert-warning">
            ⏰ {{ deadlineLabel(warning) }}
            <a routerLink="/timer" class="btn btn-sm btn-primary" style="margin-left:1rem">Timer starten</a>
          </div>
        }

        @if (upcomingReminder()) {
          <div class="alert alert-info">
            🔔 {{ upcomingReminder() }}
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

        <div class="card chart-card">
          <h3>Lernzeit der letzten 8 Wochen</h3>
          @if (!hasWeeklyData()) {
            <p class="empty">In den letzten acht Wochen ist noch keine Lernzeit erfasst.</p>
          } @else {
            <svg class="week-chart" viewBox="0 0 560 175" role="img"
              aria-label="Balkendiagramm der Lernzeit pro Woche in den letzten acht Wochen">
              <line x1="10" y1="142" x2="550" y2="142" stroke="var(--border)" stroke-width="1" />
              @for (bar of weekBars(); track bar.label) {
                <g>
                  <title>Woche ab {{ bar.label }} — {{ formatMinutes(bar.minutes) }}</title>
                  <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.w" [attr.height]="bar.h"
                    rx="2" fill="var(--primary)" />
                  @if (bar.showValue) {
                    <text [attr.x]="bar.x + bar.w / 2" [attr.y]="bar.y - 6" text-anchor="middle"
                      class="chart-value">{{ formatMinutes(bar.minutes) }}</text>
                  }
                  <text [attr.x]="bar.x + bar.w / 2" y="158" text-anchor="middle"
                    class="chart-label">{{ bar.label }}</text>
                </g>
              }
            </svg>
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
              @if (goal.weekly_budget_minutes > 0) {
                <div class="progress-label">Budget: {{ formatMinutes(goal.weekly_budget_minutes) }}/Woche</div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private planService = inject(PlanService);

  data = signal<DashboardData | null>(null);
  loading = signal(true);
  upcomingReminder = signal<string | null>(null);
  protected Math = Math;

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.dashboardService.get();
      this.data.set(data);
      await this.loadUpcomingReminder(data);
    } finally {
      this.loading.set(false);
    }
  }

  /** FR-7.2: Hinweis auf einen heute in der naechsten Stunde beginnenden Slot.
   *  Laeuft im Browser, weil planned_time eine Ortszeit-Angabe ist. */
  private async loadUpcomingReminder(data: DashboardData): Promise<void> {
    const now = new Date();
    const slots = await this.planService.list({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
    const titles = new Map(data.goals.map((g) => [g.id, g.title]));
    this.upcomingReminder.set(upcomingSlotReminder(slots, titles, now));
  }

  deadlineLabel(warning: DeadlineWarning): string {
    const when =
      warning.days_left === 0
        ? 'heute'
        : warning.days_left === 1
          ? 'morgen'
          : `in ${warning.days_left} Tagen`;
    return `„${warning.title}": Zieldatum ${when}, Fortschritt erst ${warning.progress_pct} %.`;
  }

  hasWeeklyData(): boolean {
    const d = this.data();
    return !!d && d.weekly_history.some((week) => week.minutes > 0);
  }

  /** Balkengeometrie fuer das Wochendiagramm (FR-6.3) im 560x175-SVG-Raster.
   *  Beschriftet werden nur die staerkste und die aktuelle Woche; alle Balken
   *  tragen einen nativen Tooltip. */
  weekBars(): WeekBar[] {
    const d = this.data();
    if (!d) return [];
    const weeks = d.weekly_history;
    const max = Math.max(...weeks.map((week) => week.minutes), 60);
    const plotHeight = 120;
    const top = 22;
    const gap = 12;
    const barWidth = (540 - gap * (weeks.length - 1)) / weeks.length;
    return weeks.map((week, i) => {
      const h = week.minutes > 0 ? Math.max(2, Math.round((week.minutes / max) * plotHeight)) : 0;
      const [, monthPart, dayPart] = week.week_start.split('-');
      return {
        x: Math.round(10 + i * (barWidth + gap)),
        y: top + plotHeight - h,
        w: Math.round(barWidth),
        h,
        label: `${dayPart}.${monthPart}.`,
        minutes: week.minutes,
        showValue:
          week.minutes > 0 && (i === weeks.length - 1 || week.minutes === max),
      };
    });
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

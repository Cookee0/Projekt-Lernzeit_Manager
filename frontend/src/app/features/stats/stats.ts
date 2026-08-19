import { Component, OnInit, inject, signal } from '@angular/core';
import { DashboardData, StatsData, StatsPerGoal, StatsPerMonth } from '../../core/models';
import { DashboardService } from '../../core/services/dashboard.service';
import { StatsService } from '../../core/services/stats.service';
import { WeekChartComponent } from '../../shared/week-chart';

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const AMPEL_CLASS: Record<StatsPerGoal['ampel'], string> = {
  gruen: 'progress-done',
  gelb: 'progress-mid',
  rot: 'progress-low',
};

const AMPEL_LABEL: Record<StatsPerGoal['ampel'], string> = {
  gruen: 'im Plan',
  gelb: 'knapp',
  rot: 'Rückstand',
};

/** Ein Balken des "Wann lernst du?"-Blocks, Breite relativ zum Maximum der vier Werte. */
interface DaytimeBar {
  label: string;
  minutes: number;
  widthPct: number;
}

/**
 * Auswertungsseite (FR-6.4, FR-5.3): Kennzahlenreihe und Wochendiagramm aus dem
 * Dashboard, dazu Plan-vs.-Ist je Modul und je Monat, erreichte Ziele und die
 * Verteilung der Lernzeit nach Tageszeit. Laedt Dashboard- und Stats-Daten
 * parallel und aendert an keinem der beiden Backends etwas.
 */
@Component({
  selector: 'app-stats',
  imports: [WeekChartComponent],
  template: `
    <div class="page">
      <h2>Auswertung</h2>

      @if (loading()) {
        <p class="loading">Lädt…</p>
      } @else if (dashboardData() && statsData()) {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Geplant {{ monthLabel() }}</div>
            <div class="stat-value">{{ formatMinutes(dashboardData()!.current_month.planned_minutes) }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Ungestört gelernt {{ monthLabel() }}</div>
            <div class="stat-value">{{ formatMinutes(dashboardData()!.current_month.actual_minutes) }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Erfüllungsgrad {{ monthLabel() }}</div>
            <div class="stat-value">{{ achievementPct() }}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pausen {{ monthLabel() }}</div>
            <div class="stat-value">{{ formatMinutes(dashboardData()!.current_month.paused_minutes) }}</div>
          </div>
        </div>

        <app-week-chart [history]="dashboardData()!.weekly_history" />

        <div class="card">
          <h3>Plan vs. Ist je Modul</h3>
          @if (statsData()!.per_goal.length === 0) {
            <p class="empty">Noch keine Lernziele angelegt.</p>
          } @else {
            <table class="proposal-table">
              <thead>
                <tr>
                  <th>Modul</th>
                  <th>Plan</th>
                  <th>Ist</th>
                  <th>Fortschritt</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (goal of statsData()!.per_goal; track goal.goal_id) {
                  <tr>
                    <td>
                      {{ goal.title }}
                      <span class="module-tag">{{ goal.module_name }}</span>
                    </td>
                    <td>{{ formatMinutes(goal.planned_ects_minutes) }}</td>
                    <td>{{ formatMinutes(goal.total_actual_minutes) }}</td>
                    <td>
                      <div class="progress-bar-wrap">
                        <div class="progress-bar" [class]="ampelClass(goal.ampel)"
                          [style.width.%]="Math.min(goal.progress_pct, 100)">
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="ampel-dot" [class]="'ampel-' + goal.ampel"></span>
                      {{ ampelLabel(goal.ampel) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        <div class="card">
          <h3>Plan vs. Ist je Monat</h3>
          <table class="proposal-table">
            <thead>
              <tr>
                <th>Monat</th>
                <th>Geplant</th>
                <th>Gelernt</th>
                <th>Differenz</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of statsData()!.per_month; track entry.year + '-' + entry.month) {
                <tr>
                  <td>{{ monthName(entry.month) }} {{ entry.year }}</td>
                  <td>{{ formatMinutes(entry.planned_minutes) }}</td>
                  <td>{{ formatMinutes(entry.actual_minutes) }}</td>
                  <td [class]="deviationClass(entry)">{{ deviationLabel(entry) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="card">
          <h3>Erreichte Ziele</h3>
          @if (statsData()!.achieved_goals.length === 0) {
            <p class="empty">Noch kein Ziel erreicht.</p>
          } @else {
            @for (goal of statsData()!.achieved_goals; track goal.goal_id) {
              <div class="goal-progress-card">
                <div>
                  <strong>{{ goal.title }}</strong>
                  <span class="module-tag">{{ goal.module_name }}</span>
                </div>
                <div class="goal-meta">
                  <span>📅 Ziel: {{ formatDate(goal.target_date) }}</span>
                  @if (goal.grade) { <span>🏅 Note: {{ goal.grade }}</span> }
                </div>
                @if (goal.result_note) {
                  <p class="goal-note">📝 {{ goal.result_note }}</p>
                }
              </div>
            }
          }
        </div>

        <div class="card">
          <h3>Wann lernst du?</h3>
          @if (!hasDaytimeData()) {
            <p class="empty">Noch keine Lernzeit erfasst.</p>
          } @else {
            @for (bar of daytimeBars(); track bar.label) {
              <div class="daytime-row">
                <div class="daytime-label">{{ bar.label }}</div>
                <div class="progress-bar-wrap">
                  <div class="progress-bar" [style.width.%]="bar.widthPct"></div>
                </div>
                <div class="daytime-value">{{ formatMinutes(bar.minutes) }}</div>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
})
export class StatsComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private statsService = inject(StatsService);

  dashboardData = signal<DashboardData | null>(null);
  statsData = signal<StatsData | null>(null);
  loading = signal(true);
  protected Math = Math;

  async ngOnInit(): Promise<void> {
    try {
      const [dashboard, stats] = await Promise.all([
        this.dashboardService.get(),
        this.statsService.get(),
      ]);
      this.dashboardData.set(dashboard);
      this.statsData.set(stats);
    } finally {
      this.loading.set(false);
    }
  }

  monthLabel(): string {
    const d = this.dashboardData();
    if (!d) return '';
    return MONTH_NAMES[d.current_month.month - 1];
  }

  monthName(month: number): string {
    return MONTH_NAMES[month - 1];
  }

  achievementPct(): number {
    const d = this.dashboardData();
    if (!d || d.current_month.planned_minutes === 0) return 0;
    return Math.round((d.current_month.actual_minutes / d.current_month.planned_minutes) * 100);
  }

  ampelClass(ampel: StatsPerGoal['ampel']): string {
    return AMPEL_CLASS[ampel];
  }

  ampelLabel(ampel: StatsPerGoal['ampel']): string {
    return AMPEL_LABEL[ampel];
  }

  deviationClass(entry: StatsPerMonth): string {
    return entry.actual_minutes - entry.planned_minutes >= 0 ? 'deviation-ok' : 'deviation-negative';
  }

  deviationLabel(entry: StatsPerMonth): string {
    const diff = entry.actual_minutes - entry.planned_minutes;
    const sign = diff >= 0 ? '+' : '-';
    return `${sign}${this.formatMinutes(Math.abs(diff))}`;
  }

  hasDaytimeData(): boolean {
    const d = this.statsData()?.by_daytime;
    if (!d) return false;
    return d.morning_minutes + d.afternoon_minutes + d.evening_minutes + d.night_minutes > 0;
  }

  /** Balkenbreite proportional zum groessten der vier Tageszeit-Werte. */
  daytimeBars(): DaytimeBar[] {
    const d = this.statsData()?.by_daytime;
    if (!d) return [];
    const entries: [string, number][] = [
      ['Morgen', d.morning_minutes],
      ['Mittag', d.afternoon_minutes],
      ['Abend', d.evening_minutes],
      ['Nacht', d.night_minutes],
    ];
    const max = Math.max(...entries.map(([, minutes]) => minutes), 1);
    return entries.map(([label, minutes]) => ({
      label,
      minutes,
      widthPct: minutes > 0 ? Math.max(2, Math.round((minutes / max) * 100)) : 0,
    }));
  }

  formatDate(iso: string): string {
    const [y, m, day] = iso.split('-');
    return `${day}.${m}.${y}`;
  }

  formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
}

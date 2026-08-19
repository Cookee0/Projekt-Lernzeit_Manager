import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DashboardData, StatsData, StatsPerGoal, StatsPerMonth } from '../../core/models';
import { DashboardService } from '../../core/services/dashboard.service';
import { StatsService } from '../../core/services/stats.service';
import { StatsComponent } from './stats';

function dashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    current_month: { year: 2026, month: 8, planned_minutes: 300, actual_minutes: 200, paused_minutes: 20 },
    goals: [],
    weekly_history: [],
    deadline_warnings: [],
    milestones: { done: 0, total: 0 },
    inactivity_warning: false,
    reminder_text: null,
    active_session: null,
    ...overrides,
  };
}

function statsData(overrides: Partial<StatsData> = {}): StatsData {
  return {
    per_goal: [],
    per_month: [],
    by_daytime: { morning_minutes: 0, afternoon_minutes: 0, evening_minutes: 0, night_minutes: 0 },
    achieved_goals: [],
    ...overrides,
  };
}

function perGoal(overrides: Partial<StatsPerGoal>): StatsPerGoal {
  return {
    goal_id: 1,
    title: 'Mathe II',
    module_name: 'DLBM',
    planned_ects_minutes: 900,
    total_actual_minutes: 900,
    progress_pct: 100,
    ampel: 'gruen',
    ...overrides,
  };
}

function perMonth(overrides: Partial<StatsPerMonth>): StatsPerMonth {
  return {
    year: 2026,
    month: 8,
    planned_minutes: 300,
    actual_minutes: 300,
    ...overrides,
  };
}

/** Instanziiert die Komponente ueber TestBed mit gemockten Dashboard-/Stats-Diensten,
 *  die sofort mit den uebergebenen Daten aufloesen. */
function createComponent(dashboard: DashboardData, stats: StatsData): StatsComponent {
  TestBed.configureTestingModule({
    providers: [
      { provide: DashboardService, useValue: { get: async (): Promise<DashboardData> => dashboard } },
      { provide: StatsService, useValue: { get: async (): Promise<StatsData> => stats } },
    ],
  });
  return TestBed.createComponent(StatsComponent).componentInstance;
}

describe('StatsComponent', () => {
  it('leitet die Ampelklasse korrekt aus ampel ab', () => {
    const cmp = createComponent(dashboardData(), statsData());
    expect(cmp.ampelClass('gruen')).toBe('progress-done');
    expect(cmp.ampelClass('gelb')).toBe('progress-mid');
    expect(cmp.ampelClass('rot')).toBe('progress-low');
  });

  it('leitet die Ampel-Textlabel korrekt aus ampel ab', () => {
    const cmp = createComponent(dashboardData(), statsData());
    expect(cmp.ampelLabel('gruen')).toBe('im Plan');
    expect(cmp.ampelLabel('gelb')).toBe('knapp');
    expect(cmp.ampelLabel('rot')).toBe('Rückstand');
  });

  it('zeigt deviation-ok bei actual_minutes >= planned_minutes, sonst deviation-negative', () => {
    const cmp = createComponent(dashboardData(), statsData());
    const aheadMonth = perMonth({ year: 2026, month: 7, planned_minutes: 200, actual_minutes: 250 });
    const behindMonth = perMonth({ year: 2026, month: 8, planned_minutes: 200, actual_minutes: 150 });
    const evenMonth = perMonth({ year: 2026, month: 9, planned_minutes: 200, actual_minutes: 200 });

    expect(cmp.deviationClass(aheadMonth)).toBe('deviation-ok');
    expect(cmp.deviationClass(behindMonth)).toBe('deviation-negative');
    expect(cmp.deviationClass(evenMonth)).toBe('deviation-ok');
  });

  it('berechnet die Balkenbreite der Tageszeit-Auswertung proportional zum Maximum', () => {
    const cmp = createComponent(dashboardData(), statsData());
    cmp.statsData.set(
      statsData({
        by_daytime: { morning_minutes: 60, afternoon_minutes: 30, evening_minutes: 0, night_minutes: 0 },
      }),
    );

    const bars = cmp.daytimeBars();
    const morning = bars.find((b) => b.label === 'Morgen');
    const afternoon = bars.find((b) => b.label === 'Mittag');
    const evening = bars.find((b) => b.label === 'Abend');

    expect(morning?.widthPct).toBe(100);
    expect(afternoon?.widthPct).toBe(50);
    expect(evening?.widthPct).toBe(0);
  });

  it('meldet keine Tageszeit-Daten, wenn alle vier Werte 0 sind', () => {
    const cmp = createComponent(dashboardData(), statsData());
    cmp.statsData.set(statsData());
    expect(cmp.hasDaytimeData()).toBe(false);
  });

  it('laedt Dashboard- und Stats-Daten parallel und setzt loading auf false', async () => {
    const cmp = createComponent(
      dashboardData(),
      statsData({ per_goal: [perGoal({})] }),
    );
    await cmp.ngOnInit();

    expect(cmp.loading()).toBe(false);
    expect(cmp.dashboardData()).not.toBeNull();
    expect(cmp.statsData()?.per_goal.length).toBe(1);
  });
});

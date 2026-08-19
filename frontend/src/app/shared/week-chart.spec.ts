import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { WeekPoint } from '../core/models';
import { WeekChartComponent } from './week-chart';

function point(overrides: Partial<WeekPoint>): WeekPoint {
  return { week_start: '2026-08-03', minutes: 0, ...overrides };
}

function createComponent(): WeekChartComponent {
  return TestBed.createComponent(WeekChartComponent).componentInstance;
}

describe('WeekChartComponent', () => {
  it('meldet keine Wochendaten, wenn alle Wochen 0 Minuten haben', () => {
    const cmp = createComponent();
    cmp.history = [point({ minutes: 0 }), point({ minutes: 0 })];
    expect(cmp.hasWeeklyData()).toBe(false);
  });

  it('meldet Wochendaten, sobald mindestens eine Woche Minuten hat', () => {
    const cmp = createComponent();
    cmp.history = [point({ minutes: 0 }), point({ minutes: 30 })];
    expect(cmp.hasWeeklyData()).toBe(true);
  });

  it('gibt fuer jede Woche einen Balken mit passendem Label und Hoehe 0 bei 0 Minuten', () => {
    const cmp = createComponent();
    cmp.history = [
      point({ week_start: '2026-08-03', minutes: 0 }),
      point({ week_start: '2026-08-10', minutes: 60 }),
    ];

    const bars = cmp.weekBars();

    expect(bars).toHaveLength(2);
    expect(bars[0].label).toBe('03.08.');
    expect(bars[0].h).toBe(0);
    expect(bars[1].label).toBe('10.08.');
    expect(bars[1].h).toBeGreaterThan(0);
  });

  it('skaliert die staerkste Woche auf die volle Balkenhoehe (120px Plotbereich)', () => {
    const cmp = createComponent();
    cmp.history = [
      point({ week_start: '2026-08-03', minutes: 30 }),
      point({ week_start: '2026-08-10', minutes: 60 }),
    ];

    const bars = cmp.weekBars();
    const strongest = bars.find((b) => b.minutes === 60)!;
    const weaker = bars.find((b) => b.minutes === 30)!;

    expect(strongest.h).toBe(120);
    expect(weaker.h).toBe(60);
    expect(strongest.showValue).toBe(true);
  });
});

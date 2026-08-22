import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Goal, Milestone, PlanSlot } from '../../core/models';
import { GoalService } from '../../core/services/goal.service';
import { MilestoneService } from '../../core/services/milestone.service';
import { PlanService } from '../../core/services/plan.service';
import { CalendarComponent } from './calendar';

function goal(overrides: Partial<Goal>): Goal {
  return {
    id: 1,
    user_id: 1,
    title: 'Mathe II',
    module_name: 'DLBM',
    ects: 5,
    workload_hours: null,
    status: 'open',
    priority: null,
    grade: null,
    result_note: null,
    target_date: '2026-09-15',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function slot(overrides: Partial<PlanSlot>): PlanSlot {
  return {
    id: 1,
    goal_id: 1,
    year: 2026,
    month: 9,
    day: 15,
    planned_time: null,
    duration_minutes: 60,
    note: null,
    ...overrides,
  };
}

/** Instanziiert die Komponente ueber TestBed mit den drei Diensten als
 *  einfache Mock-Objekte, die list() synchron mit leeren Listen aufloesen. */
function createComponent(): CalendarComponent {
  TestBed.configureTestingModule({
    providers: [
      { provide: PlanService, useValue: { list: async (): Promise<PlanSlot[]> => [] } },
      { provide: MilestoneService, useValue: { list: async (): Promise<Milestone[]> => [] } },
      { provide: GoalService, useValue: { list: async (): Promise<Goal[]> => [] } },
    ],
  });
  return TestBed.createComponent(CalendarComponent).componentInstance;
}

describe('CalendarComponent', () => {
  it('berechnet den Versatz des Monatsersten (Montag = erste Spalte)', () => {
    const cmp = createComponent();
    // 1. September 2026 ist ein Dienstag -> eine fuehrende Leerzelle.
    cmp.viewYear.set(2026);
    cmp.viewMonth.set(9);
    expect(cmp.leadingBlanks()).toBe(1);
  });

  it('gruppiert Slots mit gesetztem Tag unter slotsByDay, Slots ohne Tag nicht', () => {
    const cmp = createComponent();
    cmp.slots.set([
      slot({ id: 1, day: 15 }),
      slot({ id: 2, day: 15 }),
      slot({ id: 3, day: 20 }),
      slot({ id: 4, day: null }),
    ]);

    const byDay = cmp.slotsByDay();

    expect(byDay.get(15)?.map((s) => s.id)).toEqual([1, 2]);
    expect(byDay.get(20)?.map((s) => s.id)).toEqual([3]);
    expect([...byDay.values()].flat().some((s) => s.id === 4)).toBe(false);
  });

  it('ordnet ein Lernziel mit Zieldatum im angezeigten Monat dem richtigen Tag zu', () => {
    const cmp = createComponent();
    cmp.viewYear.set(2026);
    cmp.viewMonth.set(9);
    cmp.goals.set([
      goal({ id: 1, target_date: '2026-09-15' }),
      goal({ id: 2, target_date: '2026-10-01' }), // anderer Monat, soll nicht auftauchen
    ]);

    const byDay = cmp.goalsByDay();

    expect(byDay.get(15)?.map((g) => g.id)).toEqual([1]);
    expect(byDay.has(1)).toBe(false);
  });

  it('behandelt den Jahreswechsel beim Blaettern in beide Richtungen korrekt', async () => {
    const cmp = createComponent();
    cmp.viewYear.set(2026);
    cmp.viewMonth.set(12);

    await cmp.nextMonth();
    expect(cmp.viewYear()).toBe(2027);
    expect(cmp.viewMonth()).toBe(1);

    await cmp.prevMonth();
    expect(cmp.viewYear()).toBe(2026);
    expect(cmp.viewMonth()).toBe(12);
  });
});

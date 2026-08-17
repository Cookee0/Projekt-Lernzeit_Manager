import { describe, expect, it } from 'vitest';
import { PlanSlot } from './models';
import { upcomingSlotReminder } from './upcoming-slot';

// Fester Bezugszeitpunkt: 17.08.2026, 13:30 Ortszeit.
const NOW = new Date(2026, 7, 17, 13, 30);

function slot(overrides: Partial<PlanSlot>): PlanSlot {
  return {
    id: 1,
    goal_id: 42,
    year: 2026,
    month: 8,
    day: 17,
    planned_time: '14:00',
    duration_minutes: 90,
    note: null,
    ...overrides,
  };
}

const TITLES = new Map([[42, 'Mathe II']]);

describe('upcomingSlotReminder (FR-7.2)', () => {
  it('erinnert an einen Slot, der in 30 Minuten beginnt', () => {
    const text = upcomingSlotReminder([slot({})], TITLES, NOW);
    expect(text).toBe('Um 14:00 ist Lernzeit geplant (Mathe II, 90 min).');
  });

  it('nennt den fruehesten von mehreren bevorstehenden Slots', () => {
    const slots = [slot({ planned_time: '14:15' }), slot({ id: 2, planned_time: '13:45' })];
    expect(upcomingSlotReminder(slots, TITLES, NOW)).toContain('13:45');
  });

  it('ignoriert Slots, die erst in mehr als einer Stunde beginnen', () => {
    expect(upcomingSlotReminder([slot({ planned_time: '15:30' })], TITLES, NOW)).toBeNull();
  });

  it('ignoriert bereits begonnene Slots', () => {
    expect(upcomingSlotReminder([slot({ planned_time: '13:00' })], TITLES, NOW)).toBeNull();
  });

  it('ignoriert Slots ohne Uhrzeit', () => {
    expect(upcomingSlotReminder([slot({ planned_time: null })], TITLES, NOW)).toBeNull();
  });

  it('ignoriert Slots an anderen Tagen', () => {
    expect(upcomingSlotReminder([slot({ day: 18 })], TITLES, NOW)).toBeNull();
    expect(upcomingSlotReminder([slot({ day: null })], TITLES, NOW)).toBeNull();
  });

  it('kommt ohne Zieltitel aus', () => {
    const text = upcomingSlotReminder([slot({})], new Map(), NOW);
    expect(text).toBe('Um 14:00 ist Lernzeit geplant (90 min).');
  });
});

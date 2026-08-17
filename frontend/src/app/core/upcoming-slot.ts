import { PlanSlot } from './models';

/** Vorlauf in Minuten, ab dem an einen geplanten Slot erinnert wird (FR-7.2). */
export const UPCOMING_SLOT_LEAD_MINUTES = 60;

/**
 * Erinnerung an einen heute bevorstehenden Lernzeit-Slot (FR-7.2).
 *
 * Die Rechnung laeuft bewusst im Browser: `planned_time` ist eine
 * Ortszeit-Angabe der Nutzerin, und nur der Browser kennt deren lokale Uhr.
 * Geliefert wird der naechste Slot des heutigen Tages, dessen Beginn zwischen
 * jetzt und jetzt + UPCOMING_SLOT_LEAD_MINUTES liegt - oder null.
 */
export function upcomingSlotReminder(
  slots: PlanSlot[],
  goalTitles: ReadonlyMap<number, string>,
  now: Date,
): string | null {
  const leadMs = UPCOMING_SLOT_LEAD_MINUTES * 60 * 1000;
  let best: { start: Date; slot: PlanSlot } | null = null;

  for (const slot of slots) {
    if (
      slot.year !== now.getFullYear() ||
      slot.month !== now.getMonth() + 1 ||
      slot.day !== now.getDate() ||
      !slot.planned_time
    ) {
      continue;
    }
    const [hours, minutes] = slot.planned_time.split(':').map(Number);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    const diff = start.getTime() - now.getTime();
    if (diff < 0 || diff > leadMs) continue;
    if (!best || start < best.start) best = { start, slot };
  }

  if (!best) return null;
  const goal = goalTitles.get(best.slot.goal_id);
  const wo = goal ? ` (${goal}, ${best.slot.duration_minutes} min)` : ` (${best.slot.duration_minutes} min)`;
  return `Um ${best.slot.planned_time} ist Lernzeit geplant${wo}.`;
}

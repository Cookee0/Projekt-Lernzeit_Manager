import { Injectable, inject, signal } from '@angular/core';
import { DeadlineWarning, Reminder } from '../models';
import { upcomingSlotReminder } from '../upcoming-slot';
import { DashboardService } from './dashboard.service';
import { PlanService } from './plan.service';

/**
 * Erinnerungs-Hub der Navbar (FR-7.1, FR-7.2, FR-7.3).
 * Baut aus bestehenden Dashboard- und Planungsdaten drei Erinnerungsarten -
 * es gibt dafuer keinen eigenen Backend-Endpunkt und keinen
 * Gelesen/Ungelesen-Zustand (bewusste Entscheidung, siehe ExecPlan P11).
 */
@Injectable({ providedIn: 'root' })
export class ReminderService {
  private dashboardService = inject(DashboardService);
  private planService = inject(PlanService);

  private _reminders = signal<Reminder[]>([]);
  reminders = this._reminders.asReadonly();

  /**
   * Laedt Dashboard- und Planungsdaten des laufenden Monats neu und setzt
   * `reminders` in der Reihenfolge FR-7.1, dann alle FR-7.3-Eintraege, dann
   * FR-7.2 - dieselbe Reihenfolge, in der die Balken zuvor auf dem Dashboard
   * standen.
   */
  async refresh(): Promise<void> {
    const data = await this.dashboardService.get();
    const now = new Date();
    const slots = await this.planService.list({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
    const titles = new Map(data.goals.map((g) => [g.id, g.title]));

    const reminders: Reminder[] = [];

    if (data.reminder_text) {
      reminders.push({ icon: '⚠️', text: data.reminder_text, link: '/timer' });
    }

    for (const warning of data.deadline_warnings) {
      reminders.push({ icon: '⏰', text: deadlineLabel(warning), link: '/timer' });
    }

    const upcoming = upcomingSlotReminder(slots, titles, now);
    if (upcoming) {
      reminders.push({ icon: '🔔', text: upcoming, link: '/timer' });
    }

    this._reminders.set(reminders);
  }

  /** Setzt die Erinnerungen zurueck (z. B. beim Abmelden, damit auf einem
   *  geteilten Browser keine Erinnerungstexte des vorherigen Nutzers
   *  sichtbar bleiben). */
  clear(): void {
    this._reminders.set([]);
  }
}

/** FR-7.3: Text zu einer Zieldatum-Warnung (aus dashboard.ts hierher verschoben). */
function deadlineLabel(warning: DeadlineWarning): string {
  const when =
    warning.days_left === 0
      ? 'heute'
      : warning.days_left === 1
        ? 'morgen'
        : `in ${warning.days_left} Tagen`;
  return `„${warning.title}": Zieldatum ${when}, Fortschritt erst ${warning.progress_pct} %.`;
}

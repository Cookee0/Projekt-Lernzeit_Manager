import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardData } from '../models';
import { ReminderService } from './reminder.service';

// Gibt der Ereignisschleife die Gelegenheit, den .then()-Anschluss der ersten
// (geflushten) Anfrage abzuarbeiten, bevor die zweite Anfrage erwartet wird.
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function makeDashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    current_month: { year: 2026, month: 8, planned_minutes: 0, actual_minutes: 0, paused_minutes: 0 },
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

describe('ReminderService.refresh', () => {
  let service: ReminderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReminderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('baut alle drei Erinnerungsarten in der Reihenfolge FR-7.1, FR-7.3, FR-7.2', async () => {
    // Ein heute in 30 Minuten beginnender Slot loest FR-7.2 aus.
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 60 * 1000);
    const plannedTime = `${String(soon.getHours()).padStart(2, '0')}:${String(soon.getMinutes()).padStart(2, '0')}`;

    const refreshPromise = service.refresh();

    const dashboardReq = httpMock.expectOne('/api/dashboard');
    dashboardReq.flush(
      makeDashboardData({
        reminder_text: 'Heute noch nicht gelernt.',
        deadline_warnings: [
          { goal_id: 1, title: 'Statistik', target_date: '2026-08-20', days_left: 1, progress_pct: 40 },
        ],
        goals: [
          {
            id: 5,
            user_id: 1,
            title: 'Mathe I',
            module_name: 'Mathe',
            ects: 5,
            status: 'open',
            priority: null,
            grade: null,
            result_note: null,
            target_date: '2026-09-01',
            created_at: '2026-01-01T00:00:00Z',
            total_actual_minutes: 0,
            planned_ects_minutes: 0,
            weekly_budget_minutes: 0,
            milestones: [],
          },
        ],
      }),
    );
    await tick();

    const plansReq = httpMock.expectOne((r) => r.url === '/api/plans');
    plansReq.flush([
      {
        id: 10,
        goal_id: 5,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        planned_time: plannedTime,
        duration_minutes: 45,
        note: null,
      },
    ]);

    await refreshPromise;
    const reminders = service.reminders();

    expect(reminders.length).toBe(3);
    expect(reminders[0]).toEqual({ icon: '⚠️', text: 'Heute noch nicht gelernt.', link: '/timer' });
    expect(reminders[1]).toEqual({
      icon: '⏰',
      text: '„Statistik": Zieldatum morgen, Fortschritt erst 40 %.',
      link: '/timer',
    });
    expect(reminders[2].icon).toBe('🔔');
    expect(reminders[2].link).toBe('/timer');
    expect(reminders[2].text).toContain('Mathe I');
  });

  it('liefert ein leeres Array, wenn keine Erinnerung zutrifft', async () => {
    const refreshPromise = service.refresh();

    const dashboardReq = httpMock.expectOne('/api/dashboard');
    dashboardReq.flush(makeDashboardData());
    await tick();

    const plansReq = httpMock.expectOne((r) => r.url === '/api/plans');
    plansReq.flush([]);

    await refreshPromise;

    expect(service.reminders()).toEqual([]);
  });

  it('clear() setzt die Erinnerungen zurueck (z. B. beim Abmelden)', async () => {
    const refreshPromise = service.refresh();

    const dashboardReq = httpMock.expectOne('/api/dashboard');
    dashboardReq.flush(makeDashboardData({ reminder_text: 'Heute noch nicht gelernt.' }));
    await tick();

    const plansReq = httpMock.expectOne((r) => r.url === '/api/plans');
    plansReq.flush([]);

    await refreshPromise;
    expect(service.reminders().length).toBe(1);

    service.clear();

    expect(service.reminders()).toEqual([]);
  });
});

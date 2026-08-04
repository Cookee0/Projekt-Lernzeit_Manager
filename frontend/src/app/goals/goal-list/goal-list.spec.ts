import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GoalList } from './goal-list';

describe('GoalList', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoalList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('zeigt geladene Lernziele als Tabellenzeilen', async () => {
    const fixture = TestBed.createComponent(GoalList);

    httpMock.expectOne('http://localhost:5000/api/goals').flush([
      {
        id: 1,
        title: 'Klausur Mathematik',
        module: 'Mathematik I (DLBDSAM01)',
        target_date: '2027-01-15',
        status: 'offen',
        created_at: '2026-08-04T10:00:00+00:00',
      },
      {
        id: 2,
        title: 'Projektbericht abgeben',
        module: 'Projekt Software Engineering (ISEF01)',
        target_date: '2027-02-28',
        status: 'in_arbeit',
        created_at: '2026-08-04T10:00:00+00:00',
      },
    ]);
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Klausur Mathematik');
    expect(rows[0].textContent).toContain('Mathematik I (DLBDSAM01)');
    expect(rows[1].textContent).toContain('28.02.2027');
  });

  it('zeigt den Status in lesbarer Form statt als technischen Wert', async () => {
    const fixture = TestBed.createComponent(GoalList);

    httpMock.expectOne('http://localhost:5000/api/goals').flush([
      {
        id: 1,
        title: 'Projektbericht abgeben',
        module: 'Projekt Software Engineering (ISEF01)',
        target_date: '2027-02-28',
        status: 'in_arbeit',
        created_at: '2026-08-04T10:00:00+00:00',
      },
    ]);
    await fixture.whenStable();

    const statusZelle = fixture.nativeElement.querySelector('tbody tr td:last-child');
    expect(statusZelle.textContent).toContain('In Arbeit');
    expect(statusZelle.textContent).not.toContain('in_arbeit');
  });

  it('zeigt einen Hinweis, wenn es noch keine Lernziele gibt', async () => {
    const fixture = TestBed.createComponent(GoalList);

    httpMock.expectOne('http://localhost:5000/api/goals').flush([]);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Noch keine Lernziele vorhanden.');
  });
});

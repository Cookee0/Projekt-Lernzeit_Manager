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
        priority: null,
        created_at: '2026-08-04T10:00:00+00:00',
      },
      {
        id: 2,
        title: 'Projektbericht abgeben',
        module: 'Projekt Software Engineering (ISEF01)',
        target_date: '2027-02-28',
        status: 'in_arbeit',
        priority: null,
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
        priority: null,
        created_at: '2026-08-04T10:00:00+00:00',
      },
    ]);
    await fixture.whenStable();

    const statusZelle = fixture.nativeElement.querySelector('tbody tr td:nth-last-child(3)');
    expect(statusZelle.textContent).toContain('In Arbeit');
    expect(statusZelle.textContent).not.toContain('in_arbeit');
  });

  it('zeigt einen Hinweis, wenn es noch keine Lernziele gibt', async () => {
    const fixture = TestBed.createComponent(GoalList);

    httpMock.expectOne('http://localhost:5000/api/goals').flush([]);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Noch keine Lernziele vorhanden.');
  });

  it('verlinkt jede Zeile auf ihr Bearbeiten-Formular', async () => {
    const fixture = TestBed.createComponent(GoalList);

    httpMock.expectOne('http://localhost:5000/api/goals').flush([
      {
        id: 7,
        title: 'Klausur Statistik',
        module: 'Statistik (DLBDSSS01)',
        target_date: '2027-01-15',
        status: 'offen',
        priority: null,
        created_at: '2026-08-04T10:00:00+00:00',
      },
    ]);
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('tbody tr .actions a');
    expect(link.getAttribute('href')).toBe('/ziele/7/bearbeiten');
  });

  it('loescht erst nach Bestaetigung und entfernt die Zeile', async () => {
    const fixture = TestBed.createComponent(GoalList);

    httpMock.expectOne('http://localhost:5000/api/goals').flush([
      {
        id: 7,
        title: 'Klausur Statistik',
        module: 'Statistik (DLBDSSS01)',
        target_date: '2027-01-15',
        status: 'offen',
        priority: null,
        created_at: '2026-08-04T10:00:00+00:00',
      },
    ]);
    await fixture.whenStable();

    // Erster Klick: nur nachfragen, noch keine Anfrage ans Backend.
    const loeschen = fixture.nativeElement.querySelector('tbody tr .actions button');
    loeschen.click();
    await fixture.whenStable();

    httpMock.expectNone('http://localhost:5000/api/goals/7');
    expect(fixture.nativeElement.textContent).toContain('Wirklich löschen?');

    // Zweiter Klick auf "Ja, loeschen": jetzt wird geloescht.
    const bestaetigen = fixture.nativeElement.querySelector('tbody tr .actions .danger');
    bestaetigen.click();
    await fixture.whenStable();

    const request = httpMock.expectOne('http://localhost:5000/api/goals/7');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Noch keine Lernziele vorhanden.');
  });

  it('zeigt eine gesetzte Prioritaet lesbar und eine fehlende als Strich', async () => {
    const fixture = TestBed.createComponent(GoalList);

    httpMock.expectOne('http://localhost:5000/api/goals').flush([
      {
        id: 1,
        title: 'Klausur Statistik',
        module: 'Statistik (DLBDSSS01)',
        target_date: '2027-01-15',
        status: 'offen',
        priority: 'hoch',
        created_at: '2026-08-04T10:00:00+00:00',
      },
      {
        id: 2,
        title: 'Kapitel 3 lesen',
        module: 'Statistik (DLBDSSS01)',
        target_date: '2027-02-28',
        status: 'offen',
        priority: null,
        created_at: '2026-08-04T10:00:00+00:00',
      },
    ]);
    await fixture.whenStable();

    const zeilen = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(zeilen[0].querySelector('.priority').textContent).toContain('Hoch');
    expect(zeilen[1].querySelector('.priority')).toBeNull();
    expect(zeilen[1].querySelector('.priority-none').textContent).toContain('–');
  });
});

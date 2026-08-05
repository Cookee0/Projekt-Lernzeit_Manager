import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Goal } from './goal.model';
import { GoalService } from './goal.service';

describe('GoalService', () => {
  let service: GoalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GoalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('holt Lernziele per GET', () => {
    let received: Goal[] | undefined;
    service.list().subscribe((goals) => (received = goals));

    const request = httpMock.expectOne('http://localhost:5000/api/goals');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 1,
        title: 'Klausur Mathematik',
        module: 'Mathematik I (DLBDSAM01)',
        target_date: '2027-02-28',
        status: 'offen',
        created_at: '2026-08-04T10:00:00+00:00',
      },
    ]);

    expect(received?.length).toBe(1);
    expect(received?.[0].title).toBe('Klausur Mathematik');
  });

  it('legt ein Lernziel per POST an', () => {
    service
      .create({
        title: 'Projektbericht',
        module: 'Projekt Software Engineering (ISEF01)',
        target_date: '2027-02-28',
        status: 'offen',
      })
      .subscribe();

    const request = httpMock.expectOne('http://localhost:5000/api/goals');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      title: 'Projektbericht',
      module: 'Projekt Software Engineering (ISEF01)',
      target_date: '2027-02-28',
      status: 'offen',
    });
    request.flush({
      id: 2,
      title: 'Projektbericht',
      module: 'Projekt Software Engineering (ISEF01)',
      target_date: '2027-02-28',
      status: 'offen',
      created_at: '2026-08-04T10:00:00+00:00',
    });
  });

  it('holt ein einzelnes Lernziel per GET', () => {
    let received: Goal | undefined;
    service.get(7).subscribe((goal) => (received = goal));

    const request = httpMock.expectOne('http://localhost:5000/api/goals/7');
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 7,
      title: 'Klausur Statistik',
      module: 'Statistik (DLBDSSS01)',
      target_date: '2027-01-15',
      status: 'offen',
      created_at: '2026-08-04T10:00:00+00:00',
    });

    expect(received?.id).toBe(7);
    expect(received?.title).toBe('Klausur Statistik');
  });

  it('aendert ein Lernziel per PUT', () => {
    service
      .update(7, {
        title: 'Klausur Statistik',
        module: 'Statistik (DLBDSSS01)',
        target_date: '2027-06-30',
        status: 'in_arbeit',
      })
      .subscribe();

    const request = httpMock.expectOne('http://localhost:5000/api/goals/7');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      title: 'Klausur Statistik',
      module: 'Statistik (DLBDSSS01)',
      target_date: '2027-06-30',
      status: 'in_arbeit',
    });
    request.flush({
      id: 7,
      title: 'Klausur Statistik',
      module: 'Statistik (DLBDSSS01)',
      target_date: '2027-06-30',
      status: 'in_arbeit',
      created_at: '2026-08-04T10:00:00+00:00',
    });
  });

  it('loescht ein Lernziel per DELETE', () => {
    service.remove(7).subscribe();

    const request = httpMock.expectOne('http://localhost:5000/api/goals/7');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});

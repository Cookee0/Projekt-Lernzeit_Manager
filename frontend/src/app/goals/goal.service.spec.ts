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
        target_date: '2027-02-28',
        created_at: '2026-08-04T10:00:00+00:00',
      },
    ]);

    expect(received?.length).toBe(1);
    expect(received?.[0].title).toBe('Klausur Mathematik');
  });

  it('legt ein Lernziel per POST an', () => {
    service.create({ title: 'Projektbericht', target_date: '2027-02-28' }).subscribe();

    const request = httpMock.expectOne('http://localhost:5000/api/goals');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      title: 'Projektbericht',
      target_date: '2027-02-28',
    });
    request.flush({
      id: 2,
      title: 'Projektbericht',
      target_date: '2027-02-28',
      created_at: '2026-08-04T10:00:00+00:00',
    });
  });
});

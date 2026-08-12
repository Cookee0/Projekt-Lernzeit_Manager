import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PlanService } from './plan.service';

describe('PlanService.list', () => {
  let service: PlanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('filtert nur nach Lernziel, wenn kein Monat gewaehlt ist', () => {
    void service.list({ goal_id: 7 });
    const req = httpMock.expectOne((r) => r.url === '/api/plans');
    expect(req.request.params.get('goal_id')).toBe('7');
    expect(req.request.params.get('month')).toBeNull();
    expect(req.request.params.get('year')).toBeNull();
    req.flush([]);
  });

  it('filtert nur nach Monat, wenn kein Lernziel gewaehlt ist', () => {
    void service.list({ year: 2026, month: 8 });
    const req = httpMock.expectOne((r) => r.url === '/api/plans');
    expect(req.request.params.get('goal_id')).toBeNull();
    expect(req.request.params.get('year')).toBe('2026');
    expect(req.request.params.get('month')).toBe('8');
    req.flush([]);
  });

  it('fragt ohne Filter alle Planungen ab', () => {
    void service.list({});
    const req = httpMock.expectOne((r) => r.url === '/api/plans');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });
});

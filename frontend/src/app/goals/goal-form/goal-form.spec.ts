import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { GoalForm } from './goal-form';

describe('GoalForm', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoalForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'ziele', component: GoalForm }]),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('schickt kein POST, solange das Formular unvollständig ist', async () => {
    const fixture = TestBed.createComponent(GoalForm);
    await fixture.whenStable();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    httpMock.expectNone('http://localhost:5000/api/goals');
  });

  it('schickt die eingegebenen Werte als POST an das Backend', async () => {
    const fixture = TestBed.createComponent(GoalForm);
    await fixture.whenStable();

    const titleInput = fixture.nativeElement.querySelector('#title') as HTMLInputElement;
    titleInput.value = 'Projektbericht abgeben';
    titleInput.dispatchEvent(new Event('input'));

    const moduleInput = fixture.nativeElement.querySelector('#module') as HTMLInputElement;
    moduleInput.value = 'Projekt Software Engineering (ISEF01)';
    moduleInput.dispatchEvent(new Event('input'));

    const dateInput = fixture.nativeElement.querySelector('#target_date') as HTMLInputElement;
    dateInput.value = '2027-02-28';
    dateInput.dispatchEvent(new Event('input'));

    const statusSelect = fixture.nativeElement.querySelector('#status') as HTMLSelectElement;
    statusSelect.value = 'in_arbeit';
    statusSelect.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    const prioritySelect = fixture.nativeElement.querySelector('#priority') as HTMLSelectElement;
    prioritySelect.value = 'hoch';
    prioritySelect.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const request = httpMock.expectOne('http://localhost:5000/api/goals');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      title: 'Projektbericht abgeben',
      module: 'Projekt Software Engineering (ISEF01)',
      target_date: '2027-02-28',
      status: 'in_arbeit',
      priority: 'hoch',
    });
    request.flush({
      id: 1,
      title: 'Projektbericht abgeben',
      module: 'Projekt Software Engineering (ISEF01)',
      target_date: '2027-02-28',
      status: 'in_arbeit',
      priority: 'hoch',
      created_at: '2026-08-04T10:00:00+00:00',
    });
  });

  it('schickt null, wenn keine Prioritaet gewaehlt wurde', async () => {
    const fixture = TestBed.createComponent(GoalForm);
    await fixture.whenStable();

    const titleInput = fixture.nativeElement.querySelector('#title') as HTMLInputElement;
    titleInput.value = 'Ohne Prioritaet';
    titleInput.dispatchEvent(new Event('input'));

    const moduleInput = fixture.nativeElement.querySelector('#module') as HTMLInputElement;
    moduleInput.value = 'ISEF01';
    moduleInput.dispatchEvent(new Event('input'));

    const dateInput = fixture.nativeElement.querySelector('#target_date') as HTMLInputElement;
    dateInput.value = '2027-02-28';
    dateInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const request = httpMock.expectOne('http://localhost:5000/api/goals');
    expect(request.request.body.priority).toBeNull();
    request.flush({
      id: 1,
      title: 'Ohne Prioritaet',
      module: 'ISEF01',
      target_date: '2027-02-28',
      status: 'offen',
      priority: null,
      created_at: '2026-08-04T10:00:00+00:00',
    });
  });

  it('ist mit Titel und Datum, aber ohne Modul noch nicht absendbar', async () => {
    const fixture = TestBed.createComponent(GoalForm);
    await fixture.whenStable();

    const titleInput = fixture.nativeElement.querySelector('#title') as HTMLInputElement;
    titleInput.value = 'Ziel ohne Modul';
    titleInput.dispatchEvent(new Event('input'));

    const dateInput = fixture.nativeElement.querySelector('#target_date') as HTMLInputElement;
    dateInput.value = '2027-02-28';
    dateInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    httpMock.expectNone('http://localhost:5000/api/goals');
  });
});

describe('GoalForm im Bearbeiten-Modus', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoalForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'ziele', component: GoalForm }]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } },
        },
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('laedt das Lernziel und fuellt das Formular vor', async () => {
    const fixture = TestBed.createComponent(GoalForm);

    httpMock.expectOne('http://localhost:5000/api/goals/7').flush({
      id: 7,
      title: 'Klausur Statistik',
      module: 'Statistik (DLBDSSS01)',
      target_date: '2027-01-15',
      status: 'in_arbeit',
      priority: null,
      created_at: '2026-08-04T10:00:00+00:00',
    });
    await fixture.whenStable();

    const titleInput = fixture.nativeElement.querySelector('#title') as HTMLInputElement;
    const statusSelect = fixture.nativeElement.querySelector('#status') as HTMLSelectElement;
    expect(titleInput.value).toBe('Klausur Statistik');
    expect(statusSelect.value).toBe('in_arbeit');
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain(
      'Lernziel bearbeiten',
    );
  });

  it('speichert Aenderungen per PUT auf dasselbe Lernziel', async () => {
    const fixture = TestBed.createComponent(GoalForm);

    httpMock.expectOne('http://localhost:5000/api/goals/7').flush({
      id: 7,
      title: 'Klausur Statistik',
      module: 'Statistik (DLBDSSS01)',
      target_date: '2027-01-15',
      status: 'offen',
      priority: 'mittel',
      created_at: '2026-08-04T10:00:00+00:00',
    });
    await fixture.whenStable();

    const dateInput = fixture.nativeElement.querySelector('#target_date') as HTMLInputElement;
    dateInput.value = '2027-06-30';
    dateInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const request = httpMock.expectOne('http://localhost:5000/api/goals/7');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      title: 'Klausur Statistik',
      module: 'Statistik (DLBDSSS01)',
      target_date: '2027-06-30',
      status: 'offen',
      priority: 'mittel',
    });
    request.flush({
      id: 7,
      title: 'Klausur Statistik',
      module: 'Statistik (DLBDSSS01)',
      target_date: '2027-06-30',
      status: 'offen',
      priority: 'mittel',
      created_at: '2026-08-04T10:00:00+00:00',
    });
  });
});

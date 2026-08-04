import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

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

    const dateInput = fixture.nativeElement.querySelector('#target_date') as HTMLInputElement;
    dateInput.value = '2027-02-28';
    dateInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const request = httpMock.expectOne('http://localhost:5000/api/goals');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      title: 'Projektbericht abgeben',
      target_date: '2027-02-28',
    });
    request.flush({
      id: 1,
      title: 'Projektbericht abgeben',
      target_date: '2027-02-28',
      created_at: '2026-08-04T10:00:00+00:00',
    });
  });
});

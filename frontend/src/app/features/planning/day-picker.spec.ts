import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DayPickerComponent } from './day-picker';

// September 2026 dient als Testmonat: 30 Tage, 1. September ist ein Dienstag.
const YEAR = 2026;
const MONTH = 9;
const MITTWOCHE = [2, 9, 16, 23, 30];
const WERKTAGE = [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30];

function createFixture(selected: number[] = []) {
  const fixture = TestBed.createComponent(DayPickerComponent);
  fixture.componentInstance.year = YEAR;
  fixture.componentInstance.month = MONTH;
  fixture.componentInstance.selected = selected;
  fixture.detectChanges();
  return fixture;
}

function findButtonByText(fixture: ReturnType<typeof createFixture>, text: string) {
  const button = fixture.debugElement
    .queryAll(By.css('button'))
    .find((el) => el.nativeElement.textContent.trim() === text);
  if (!button) throw new Error(`Button mit Text "${text}" nicht gefunden`);
  return button;
}

describe('DayPickerComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DayPickerComponent] });
  });

  it('Werktage wählt alle Mo–Fr des Monats', () => {
    const fixture = createFixture();
    let emitted: number[] | undefined;
    fixture.componentInstance.selectedChange.subscribe((v) => (emitted = v));

    findButtonByText(fixture, 'Werktage').nativeElement.click();

    expect(emitted).toEqual(WERKTAGE);
  });

  it('Klick auf gewählten Tag wählt ab', () => {
    const fixture = createFixture();
    let emitted: number[] = [];
    fixture.componentInstance.selectedChange.subscribe((v) => (emitted = v));

    findButtonByText(fixture, '5').nativeElement.click();
    expect(emitted).toEqual([5]);

    fixture.componentInstance.selected = emitted;
    fixture.detectChanges();

    findButtonByText(fixture, '5').nativeElement.click();
    expect(emitted).toEqual([]);
  });

  it('Wochentagsknopf Mi wählt alle Mittwoche', () => {
    const fixture = createFixture();
    let emitted: number[] | undefined;
    fixture.componentInstance.selectedChange.subscribe((v) => (emitted = v));

    findButtonByText(fixture, 'Mi').nativeElement.click();

    expect(emitted).toEqual(MITTWOCHE);
  });
});

# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: planning.spec.ts >> Lernzeit planen (FR-2, FR-3) >> Geplante Lernzeit löschen
- Location: e2e\planning.spec.ts:45:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Für diesen Monat noch nichts geplant.')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Für diesen Monat noch nichts geplant.')

```

```yaml
- navigation:
  - link "📚 Lernzeit-Manager":
    - /url: /
  - list:
    - listitem:
      - link "Dashboard":
        - /url: /
    - listitem:
      - link "Lernziele":
        - /url: /goals
    - listitem:
      - link "Planung":
        - /url: /planning
    - listitem:
      - link "Timer":
        - /url: /timer
  - text: Planning Tester 1787001264608
  - button "Abmelden"
- heading "Planung" [level=2]
- heading "Filter" [level=3]
- text: Lernziel
- combobox "Lernziel":
  - option "Alle Ziele" [selected]
  - option "Planungs-Ziel"
- text: Monat
- combobox "Monat":
  - option "Alle Monate"
  - option "Jul 2026"
  - option "Aug 2026" [selected]
  - option "Sep 2026"
  - option "Okt 2026"
  - option "Nov 2026"
  - option "Dez 2026"
  - option "Jan 2027"
  - option "Feb 2027"
  - option "Mär 2027"
- heading "Lernzeit einplanen" [level=3]
- text: Lernziel *
- combobox "Lernziel *":
  - option "Ziel wählen" [disabled] [selected]
  - option "Planungs-Ziel"
- text: Monat *
- combobox "Monat *":
  - option "Jul 2026"
  - option "Aug 2026" [selected]
  - option "Sep 2026"
  - option "Okt 2026"
  - option "Nov 2026"
  - option "Dez 2026"
  - option "Jan 2027"
  - option "Feb 2027"
  - option "Mär 2027"
- text: Tag des Monats (optional)
- spinbutton "Tag des Monats (optional)"
- text: Uhrzeit (optional)
- textbox "Uhrzeit (optional)"
- text: Wie lange? (Minuten)
- spinbutton "Wie lange? (Minuten)": "60"
- text: Notiz (optional)
- textbox "Notiz (optional)":
  - /placeholder: z.B. Kapitel 3 lesen
- button "Lernzeit speichern"
- heading "Geplante Lernzeiten" [level=3]
- paragraph: Für diese Auswahl ist noch nichts geplant.
- heading "Zwischenziele Aug 2026" [level=3]
- text: 0 / 0
- paragraph: Für diesen Monat ist noch kein Zwischenziel festgelegt.
- text: Neues Zwischenziel
- textbox "Neues Zwischenziel":
  - /placeholder: z.B. Kapitel 3 abschließen
- text: Bis Tag (optional)
- spinbutton "Bis Tag (optional)"
- button "+ Zwischenziel"
```

# Test source

```ts
  1  | import { test, expect, Page } from '@playwright/test';
  2  | 
  3  | const timestamp = Date.now();
  4  | const email = `planning-${timestamp}@playwright.local`;
  5  | const password = 'Sicher123';
  6  | 
  7  | async function setup(page: Page): Promise<void> {
  8  |   // Registrieren
  9  |   await page.goto('/register');
  10 |   await page.getByLabel('Name').fill(`Planning Tester ${timestamp}`);
  11 |   await page.getByLabel('E-Mail').fill(email);
  12 |   await page.getByLabel('Passwort').fill(password);
  13 |   await page.getByRole('button', { name: 'Konto erstellen' }).click();
  14 |   await expect(page).toHaveURL('/');
  15 | 
  16 |   // Lernziel anlegen (Voraussetzung für Planung)
  17 |   await page.goto('/goals');
  18 |   await page.getByLabel('Titel').fill('Planungs-Ziel');
  19 |   await page.getByLabel('Modul / Kurs').fill('PLAN01');
  20 |   await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
  21 |   await expect(page.getByText('Planungs-Ziel')).toBeVisible();
  22 | }
  23 | 
  24 | test.describe('Lernzeit planen (FR-2, FR-3)', () => {
  25 |   test.beforeEach(async ({ page }) => {
  26 |     await setup(page);
  27 |     await page.goto('/planning');
  28 |   });
  29 | 
  30 |   test('Lernzeit einplanen und in Liste sehen', async ({ page }) => {
  31 |     // Lernziel im Formular wählen
  32 |     await page.locator('select[name="slot_goal"]').selectOption({ label: 'Planungs-Ziel' });
  33 | 
  34 |     // Dauer auf 90 Minuten setzen
  35 |     const durationInput = page.getByLabel('Wie lange? (Minuten)');
  36 |     await durationInput.fill('90');
  37 | 
  38 |     await page.getByRole('button', { name: 'Lernzeit speichern' }).click();
  39 | 
  40 |     // In der Liste erscheinen
  41 |     await expect(page.getByText('90 min')).toBeVisible();
  42 |     await expect(page.getByText('Planungs-Ziel')).toBeVisible();
  43 |   });
  44 | 
  45 |   test('Geplante Lernzeit löschen', async ({ page }) => {
  46 |     // Slot anlegen
  47 |     await page.locator('select[name="slot_goal"]').selectOption({ label: 'Planungs-Ziel' });
  48 |     await page.getByRole('button', { name: 'Lernzeit speichern' }).click();
  49 |     await expect(page.locator('.slot-card')).toBeVisible();
  50 | 
  51 |     // Löschen
  52 |     await page.getByRole('button', { name: 'Löschen' }).first().click();
> 53 |     await expect(page.getByText('Für diesen Monat noch nichts geplant.')).toBeVisible();
     |                                                                           ^ Error: expect(locator).toBeVisible() failed
  54 |   });
  55 | });
  56 | 
```
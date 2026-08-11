# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: planning.spec.ts >> Lernzeit planen (FR-2, FR-3) >> Lernzeit einplanen und in Liste sehen
- Location: e2e\planning.spec.ts:30:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:4200/"
Received: "http://localhost:4200/register"
Timeout:  5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × locator resolved to <html lang="de">…</html>
       - unexpected value "http://localhost:4200/register"

```

```yaml
- navigation:
  - link "📚 Lernzeit-Manager":
    - /url: /
- heading "Lernzeit-Manager" [level=1]
- heading "Registrieren" [level=2]
- text: Registrierung fehlgeschlagen. Name
- textbox "Name":
  - /placeholder: Dein Name
  - text: Planning Tester 1786434928232
- text: E-Mail
- textbox "E-Mail":
  - /placeholder: name@beispiel.de
  - text: planning-1786434928232@playwright.local
- text: Passwort
- textbox "Passwort":
  - /placeholder: Mindestens 6 Zeichen
  - text: Sicher123
- button "Konto erstellen"
- paragraph:
  - text: Bereits registriert?
  - link "Anmelden":
    - /url: /login
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
> 14 |   await expect(page).toHaveURL('/');
     |                      ^ Error: expect(page).toHaveURL(expected) failed
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
  53 |     await expect(page.getByText('Für diesen Monat noch nichts geplant.')).toBeVisible();
  54 |   });
  55 | });
  56 | 
```
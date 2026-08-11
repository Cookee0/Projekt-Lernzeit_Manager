# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: goals.spec.ts >> Lernziele (FR-1) >> Lernziel löschen
- Location: e2e\goals.spec.ts:53:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://localhost:4200/"
Received: "http://localhost:4200/register"
Timeout:  5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × locator resolved to <html lang="de">…</html>
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
  - text: Goals Tester 1786434949524
- text: E-Mail
- textbox "E-Mail":
  - /placeholder: name@beispiel.de
  - text: goals-1786434949524@playwright.local
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
  4  | const email = `goals-${timestamp}@playwright.local`;
  5  | const password = 'Sicher123';
  6  | 
  7  | async function registerAndLogin(page: Page): Promise<void> {
  8  |   await page.goto('/register');
  9  |   await page.getByLabel('Name').fill(`Goals Tester ${timestamp}`);
  10 |   await page.getByLabel('E-Mail').fill(email);
  11 |   await page.getByLabel('Passwort').fill(password);
  12 |   await page.getByRole('button', { name: 'Konto erstellen' }).click();
> 13 |   await expect(page).toHaveURL('/');
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  14 | }
  15 | 
  16 | test.describe('Lernziele (FR-1)', () => {
  17 |   test.beforeEach(async ({ page }) => {
  18 |     await registerAndLogin(page);
  19 |     await page.goto('/goals');
  20 |   });
  21 | 
  22 |   test('Lernziel anlegen', async ({ page }) => {
  23 |     await page.getByLabel('Titel').fill('Mathematik I');
  24 |     await page.getByLabel('Modul / Kurs').fill('DLBMAMATH01');
  25 |     await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
  26 | 
  27 |     await expect(page.getByText('Mathematik I')).toBeVisible();
  28 |     await expect(page.getByText('DLBMAMATH01')).toBeVisible();
  29 |   });
  30 | 
  31 |   test('Lernziel als In Arbeit markieren', async ({ page }) => {
  32 |     // Ziel anlegen
  33 |     await page.getByLabel('Titel').fill('Statistik');
  34 |     await page.getByLabel('Modul / Kurs').fill('STAT01');
  35 |     await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
  36 |     await expect(page.getByText('Statistik')).toBeVisible();
  37 | 
  38 |     // Status auf In Arbeit setzen
  39 |     await page.getByRole('button', { name: '▶ In Arbeit' }).first().click();
  40 |     await expect(page.getByText('In Arbeit')).toBeVisible();
  41 |   });
  42 | 
  43 |   test('Lernziel als Erreicht markieren', async ({ page }) => {
  44 |     await page.getByLabel('Titel').fill('Englisch B2');
  45 |     await page.getByLabel('Modul / Kurs').fill('ENG01');
  46 |     await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
  47 |     await expect(page.getByText('Englisch B2')).toBeVisible();
  48 | 
  49 |     await page.getByRole('button', { name: '✓ Erreicht' }).first().click();
  50 |     await expect(page.getByText('Erreicht')).toBeVisible();
  51 |   });
  52 | 
  53 |   test('Lernziel löschen', async ({ page }) => {
  54 |     await page.getByLabel('Titel').fill('Lösch-Test');
  55 |     await page.getByLabel('Modul / Kurs').fill('DEL01');
  56 |     await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
  57 |     await expect(page.getByText('Lösch-Test')).toBeVisible();
  58 | 
  59 |     page.on('dialog', dialog => dialog.accept());
  60 |     await page.getByRole('button', { name: '🗑 Löschen' }).first().click();
  61 | 
  62 |     await expect(page.getByText('Lösch-Test')).not.toBeVisible();
  63 |   });
  64 | });
  65 | 
```
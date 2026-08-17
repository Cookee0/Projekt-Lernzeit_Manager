# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: goals.spec.ts >> Lernziele (FR-1) >> Lernziel löschen
- Location: e2e\goals.spec.ts:56:7

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
- text: E-Mail bereits registriert Name
- textbox "Name":
  - /placeholder: Dein Name
  - text: Goals Tester 1787001269696
- text: E-Mail
- textbox "E-Mail":
  - /placeholder: name@beispiel.de
  - text: goals-1787001269696@playwright.local
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
  23 |     const anlegen = page.locator('.card', { hasText: 'Neues Lernziel' });
  24 |     await anlegen.getByLabel('Titel').fill('Mathematik I');
  25 |     await anlegen.getByLabel('Modul / Kurs').fill('DLBMAMATH01');
  26 |     await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
  27 | 
  28 |     await expect(page.getByText('Mathematik I')).toBeVisible();
  29 |     await expect(page.getByText('DLBMAMATH01')).toBeVisible();
  30 |   });
  31 | 
  32 |   test('Lernziel als In Arbeit markieren', async ({ page }) => {
  33 |     // Ziel anlegen
  34 |     const anlegen = page.locator('.card', { hasText: 'Neues Lernziel' });
  35 |     await anlegen.getByLabel('Titel').fill('Statistik');
  36 |     await anlegen.getByLabel('Modul / Kurs').fill('STAT01');
  37 |     await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
  38 |     await expect(page.getByText('Statistik')).toBeVisible();
  39 | 
  40 |     // Status auf In Arbeit setzen
  41 |     await page.getByRole('button', { name: '▶ In Arbeit' }).first().click();
  42 |     await expect(page.getByText('In Arbeit')).toBeVisible();
  43 |   });
  44 | 
  45 |   test('Lernziel als Erreicht markieren', async ({ page }) => {
  46 |     const anlegen = page.locator('.card', { hasText: 'Neues Lernziel' });
  47 |     await anlegen.getByLabel('Titel').fill('Englisch B2');
  48 |     await anlegen.getByLabel('Modul / Kurs').fill('ENG01');
  49 |     await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
  50 |     await expect(page.getByText('Englisch B2')).toBeVisible();
  51 | 
  52 |     await page.getByRole('button', { name: '✓ Erreicht' }).first().click();
  53 |     await expect(page.getByText('Erreicht')).toBeVisible();
  54 |   });
  55 | 
  56 |   test('Lernziel löschen', async ({ page }) => {
  57 |     const anlegen = page.locator('.card', { hasText: 'Neues Lernziel' });
  58 |     await anlegen.getByLabel('Titel').fill('Lösch-Test');
  59 |     await anlegen.getByLabel('Modul / Kurs').fill('DEL01');
  60 |     await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
  61 |     await expect(page.getByText('Lösch-Test')).toBeVisible();
  62 | 
  63 |     page.on('dialog', dialog => dialog.accept());
  64 |     await page.getByRole('button', { name: '🗑 Löschen' }).first().click();
  65 | 
  66 |     await expect(page.getByText('Lösch-Test')).not.toBeVisible();
  67 |   });
  68 | });
  69 | 
```
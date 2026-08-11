# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: timer.spec.ts >> Lernzeit-Timer (FR-4) >> Session stoppen — erscheint im Verlauf
- Location: e2e\timer.spec.ts:52:7

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
  - text: Timer Tester 1786434942254
- text: E-Mail
- textbox "E-Mail":
  - /placeholder: name@beispiel.de
  - text: timer-1786434942254@playwright.local
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
  4  | const email = `timer-${timestamp}@playwright.local`;
  5  | const password = 'Sicher123';
  6  | 
  7  | async function setup(page: Page): Promise<void> {
  8  |   await page.goto('/register');
  9  |   await page.getByLabel('Name').fill(`Timer Tester ${timestamp}`);
  10 |   await page.getByLabel('E-Mail').fill(email);
  11 |   await page.getByLabel('Passwort').fill(password);
  12 |   await page.getByRole('button', { name: 'Konto erstellen' }).click();
> 13 |   await expect(page).toHaveURL('/');
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  14 | 
  15 |   // Lernziel anlegen (Voraussetzung für Timer)
  16 |   await page.goto('/goals');
  17 |   await page.getByLabel('Titel').fill('Timer-Ziel');
  18 |   await page.getByLabel('Modul / Kurs').fill('TMR01');
  19 |   await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
  20 |   await expect(page.getByText('Timer-Ziel')).toBeVisible();
  21 | }
  22 | 
  23 | test.describe('Lernzeit-Timer (FR-4)', () => {
  24 |   test.beforeEach(async ({ page }) => {
  25 |     await setup(page);
  26 |     await page.goto('/timer');
  27 |   });
  28 | 
  29 |   test('Session starten — Timer läuft', async ({ page }) => {
  30 |     await page.locator('select[name="goal"]').selectOption({ label: 'Timer-Ziel' });
  31 |     await page.getByRole('button', { name: '▶ Start' }).click();
  32 | 
  33 |     await expect(page.getByText('Timer-Ziel')).toBeVisible();
  34 |     await expect(page.getByText('▶ Läuft')).toBeVisible();
  35 |     await expect(page.getByRole('button', { name: '⏸ Pause' })).toBeVisible();
  36 |   });
  37 | 
  38 |   test('Session pausieren und fortsetzen', async ({ page }) => {
  39 |     await page.locator('select[name="goal"]').selectOption({ label: 'Timer-Ziel' });
  40 |     await page.getByRole('button', { name: '▶ Start' }).click();
  41 |     await expect(page.getByText('▶ Läuft')).toBeVisible();
  42 | 
  43 |     // Pausieren
  44 |     await page.getByRole('button', { name: '⏸ Pause' }).click();
  45 |     await expect(page.getByText('⏸ Pausiert')).toBeVisible();
  46 | 
  47 |     // Fortsetzen
  48 |     await page.getByRole('button', { name: '▶ Weiter' }).click();
  49 |     await expect(page.getByText('▶ Läuft')).toBeVisible();
  50 |   });
  51 | 
  52 |   test('Session stoppen — erscheint im Verlauf', async ({ page }) => {
  53 |     await page.locator('select[name="goal"]').selectOption({ label: 'Timer-Ziel' });
  54 |     await page.getByRole('button', { name: '▶ Start' }).click();
  55 |     await expect(page.getByText('▶ Läuft')).toBeVisible();
  56 | 
  57 |     // Kurz warten damit duration_seconds > 0
  58 |     await page.waitForTimeout(2000);
  59 | 
  60 |     await page.getByRole('button', { name: '⏹ Stopp' }).click();
  61 | 
  62 |     // Timer zeigt Start-Screen
  63 |     await expect(page.getByRole('button', { name: '▶ Start' })).toBeVisible();
  64 | 
  65 |     // Session erscheint in Verlauf
  66 |     await expect(page.getByText('Zuletzt gelernt')).toBeVisible();
  67 |     await expect(page.getByText('Timer-Ziel')).toBeVisible();
  68 |   });
  69 | });
  70 | 
```
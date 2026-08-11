# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentifizierung >> Registrierung und Login
- Location: e2e\auth.spec.ts:9:7

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
  - text: Playwright Nutzer 1786434928336
- text: E-Mail
- textbox "E-Mail":
  - /placeholder: name@beispiel.de
  - text: test-1786434928336@playwright.local
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
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const timestamp = Date.now();
  4  | const testEmail = `test-${timestamp}@playwright.local`;
  5  | const testName = `Playwright Nutzer ${timestamp}`;
  6  | const testPassword = 'Sicher123';
  7  | 
  8  | test.describe('Authentifizierung', () => {
  9  |   test('Registrierung und Login', async ({ page }) => {
  10 |     // Zur Registrierungsseite navigieren
  11 |     await page.goto('/register');
  12 |     await expect(page.getByRole('heading', { name: 'Registrieren' })).toBeVisible();
  13 | 
  14 |     // Formular ausfüllen
  15 |     await page.getByLabel('Name').fill(testName);
  16 |     await page.getByLabel('E-Mail').fill(testEmail);
  17 |     await page.getByLabel('Passwort').fill(testPassword);
  18 |     await page.getByRole('button', { name: 'Konto erstellen' }).click();
  19 | 
  20 |     // Nach Registrierung auf Dashboard landen
> 21 |     await expect(page).toHaveURL('/');
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  22 |     await expect(page.getByText('Dashboard')).toBeVisible();
  23 | 
  24 |     // Abmelden
  25 |     await page.getByRole('button', { name: 'Abmelden' }).click();
  26 |     await expect(page).toHaveURL('/login');
  27 | 
  28 |     // Wieder einloggen
  29 |     await page.getByLabel('E-Mail').fill(testEmail);
  30 |     await page.getByLabel('Passwort').fill(testPassword);
  31 |     await page.getByRole('button', { name: 'Anmelden' }).click();
  32 | 
  33 |     await expect(page).toHaveURL('/');
  34 |     await expect(page.getByText('Dashboard')).toBeVisible();
  35 |   });
  36 | 
  37 |   test('Login mit falschen Daten zeigt Fehlermeldung', async ({ page }) => {
  38 |     await page.goto('/login');
  39 |     await page.getByLabel('E-Mail').fill('falsch@example.com');
  40 |     await page.getByLabel('Passwort').fill('FalschesPasswort');
  41 |     await page.getByRole('button', { name: 'Anmelden' }).click();
  42 | 
  43 |     await expect(page.getByText(/ungültig|nicht korrekt|Anmeldung fehlgeschlagen/i)).toBeVisible();
  44 |   });
  45 | 
  46 |   test('Nicht eingeloggter Nutzer wird zur Login-Seite weitergeleitet', async ({ page }) => {
  47 |     await page.goto('/goals');
  48 |     await expect(page).toHaveURL('/login');
  49 |   });
  50 | });
  51 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentifizierung >> Registrierung und Login
- Location: e2e\auth.spec.ts:9:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Dashboard')
Expected: visible
Error: strict mode violation: getByText('Dashboard') resolved to 2 elements:
    1) <a href="/" routerlink="/" class="active" routerlinkactive="active">Dashboard</a> aka getByRole('link', { name: 'Dashboard' })
    2) <h2>Dashboard</h2> aka getByRole('heading', { name: 'Dashboard' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Dashboard')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e4]:
    - link "📚 Lernzeit-Manager" [ref=e6] [cursor=pointer]:
      - /url: /
    - list [ref=e7]:
      - listitem [ref=e8]:
        - link "Dashboard" [ref=e9] [cursor=pointer]:
          - /url: /
      - listitem [ref=e10]:
        - link "Lernziele" [ref=e11] [cursor=pointer]:
          - /url: /goals
      - listitem [ref=e12]:
        - link "Planung" [ref=e13] [cursor=pointer]:
          - /url: /planning
      - listitem [ref=e14]:
        - link "Timer" [ref=e15] [cursor=pointer]:
          - /url: /timer
    - generic [ref=e16]:
      - generic [ref=e17]: Playwright Nutzer 1787001262259
      - button "Abmelden" [ref=e18] [cursor=pointer]
  - generic [ref=e20]:
    - heading "Dashboard" [level=2] [ref=e21]
    - generic [ref=e22]:
      - generic [ref=e23]:
        - generic [ref=e24]: Geplant August
        - generic [ref=e25]: 0 min
      - generic [ref=e26]:
        - generic [ref=e27]: Gelernt August
        - generic [ref=e28]: 0 min
      - generic [ref=e29]:
        - generic [ref=e30]: Geschafft
        - generic [ref=e31]: 0%
      - generic [ref=e32]:
        - generic [ref=e33]: Zwischenziele August
        - generic [ref=e34]: 0 / 0
    - generic [ref=e35]:
      - heading "Dein Fortschritt im August" [level=3] [ref=e36]
      - paragraph [ref=e37]:
        - text: Noch keine Lernzeiten für diesen Monat geplant.
        - link "Jetzt planen →" [ref=e38] [cursor=pointer]:
          - /url: /planning
    - generic [ref=e39]:
      - generic [ref=e40]:
        - heading "Lernziele" [level=3] [ref=e41]
        - link "+ Neues Lernziel erstellen" [ref=e42] [cursor=pointer]:
          - /url: /goals
      - paragraph [ref=e43]:
        - text: Noch keine Lernziele.
        - link "Erstelle dein erstes Ziel." [ref=e44] [cursor=pointer]:
          - /url: /goals
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
  21 |     await expect(page).toHaveURL('/');
> 22 |     await expect(page.getByText('Dashboard')).toBeVisible();
     |                                               ^ Error: expect(locator).toBeVisible() failed
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
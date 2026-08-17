# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: planning.spec.ts >> Lernzeit planen (FR-2, FR-3) >> Lernzeit einplanen und in Liste sehen
- Location: e2e\planning.spec.ts:30:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Planungs-Ziel')
Expected: visible
Error: strict mode violation: getByText('Planungs-Ziel') resolved to 3 elements:
    1) <option value="26">Planungs-Ziel</option> aka getByLabel('Lernziel', { exact: true })
    2) <option value="26">Planungs-Ziel</option> aka getByLabel('Lernziel *')
    3) <span>Planungs-Ziel</span> aka locator('span').filter({ hasText: 'Planungs-Ziel' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Planungs-Ziel')

```

# Page snapshot

```yaml
- generic [ref=f2e2]:
  - navigation [ref=f2e4]:
    - link "📚 Lernzeit-Manager" [ref=f2e6] [cursor=pointer]:
      - /url: /
    - list [ref=f2e7]:
      - listitem [ref=f2e8]:
        - link "Dashboard" [ref=f2e9] [cursor=pointer]:
          - /url: /
      - listitem [ref=f2e10]:
        - link "Lernziele" [ref=f2e11] [cursor=pointer]:
          - /url: /goals
      - listitem [ref=f2e12]:
        - link "Planung" [ref=f2e13] [cursor=pointer]:
          - /url: /planning
      - listitem [ref=f2e14]:
        - link "Timer" [ref=f2e15] [cursor=pointer]:
          - /url: /timer
    - generic [ref=f2e16]:
      - generic [ref=f2e17]: Planning Tester 1787001262273
      - button "Abmelden" [ref=f2e18] [cursor=pointer]
  - generic [ref=f2e20]:
    - heading "Planung" [level=2] [ref=f2e21]
    - generic [ref=f2e22]:
      - heading "Filter" [level=3] [ref=f2e23]
      - generic [ref=f2e24]:
        - generic [ref=f2e25]:
          - generic [ref=f2e26]: Lernziel
          - combobox "Lernziel" [ref=f2e27]:
            - option "Alle Ziele" [selected]
            - option "Planungs-Ziel"
        - generic [ref=f2e28]:
          - generic [ref=f2e29]: Monat
          - combobox "Monat" [ref=f2e30]:
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
    - generic [ref=f2e31]:
      - heading "Lernzeit einplanen" [level=3] [ref=f2e32]
      - generic [ref=f2e33]:
        - generic [ref=f2e34]:
          - generic [ref=f2e35]:
            - generic [ref=f2e36]: Lernziel *
            - combobox "Lernziel *" [ref=f2e37]:
              - option "Ziel wählen" [disabled] [selected]
              - option "Planungs-Ziel"
          - generic [ref=f2e38]:
            - generic [ref=f2e39]: Monat *
            - combobox "Monat *" [ref=f2e40]:
              - option "Jul 2026"
              - option "Aug 2026" [selected]
              - option "Sep 2026"
              - option "Okt 2026"
              - option "Nov 2026"
              - option "Dez 2026"
              - option "Jan 2027"
              - option "Feb 2027"
              - option "Mär 2027"
          - generic [ref=f2e41]:
            - generic [ref=f2e42]: Tag des Monats (optional)
            - spinbutton "Tag des Monats (optional)" [ref=f2e43]
        - generic [ref=f2e44]:
          - generic [ref=f2e45]:
            - generic [ref=f2e46]: Uhrzeit (optional)
            - textbox "Uhrzeit (optional)" [ref=f2e47]
          - generic [ref=f2e48]:
            - generic [ref=f2e49]: Wie lange? (Minuten)
            - spinbutton "Wie lange? (Minuten)" [ref=f2e50]: "60"
        - generic [ref=f2e51]:
          - generic [ref=f2e52]: Notiz (optional)
          - textbox "Notiz (optional)" [ref=f2e53]:
            - /placeholder: z.B. Kapitel 3 lesen
        - button "Lernzeit speichern" [ref=f2e54] [cursor=pointer]
    - generic [ref=f2e55]:
      - heading "Geplante Lernzeiten" [level=3] [ref=f2e56]
      - generic [ref=f2e57]:
        - generic [ref=f2e58]:
          - generic [ref=f2e59]: Planungs-Ziel
          - generic [ref=f2e60]: 90 min
        - generic [ref=f2e61]: 📆 Aug 2026
        - button "Löschen" [ref=f2e63] [cursor=pointer]
    - generic [ref=f2e64]:
      - generic [ref=f2e65]:
        - heading "Zwischenziele Aug 2026" [level=3] [ref=f2e66]
        - generic [ref=f2e67]: 0 / 0
      - paragraph [ref=f2e68]: Für diesen Monat ist noch kein Zwischenziel festgelegt.
      - generic [ref=f2e69]:
        - generic [ref=f2e70]:
          - generic [ref=f2e71]: Neues Zwischenziel
          - textbox "Neues Zwischenziel" [ref=f2e72]:
            - /placeholder: z.B. Kapitel 3 abschließen
        - generic [ref=f2e73]:
          - generic [ref=f2e74]: Bis Tag (optional)
          - spinbutton "Bis Tag (optional)" [ref=f2e75]
      - button "+ Zwischenziel" [ref=f2e76] [cursor=pointer]
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
> 42 |     await expect(page.getByText('Planungs-Ziel')).toBeVisible();
     |                                                   ^ Error: expect(locator).toBeVisible() failed
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
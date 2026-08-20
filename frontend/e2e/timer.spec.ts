import { test, expect, Page } from '@playwright/test';

const password = 'Sicher123';

// Jeder Testfall registriert ein eigenes Konto (eindeutige E-Mail je Aufruf), damit die Tests
// unabhaengig von Ausfuehrungsreihenfolge und Parallelitaet sind.
async function setup(page: Page): Promise<void> {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await page.goto('/register');
  await page.getByLabel('Name').fill(`Timer Tester ${unique}`);
  await page.getByLabel('E-Mail').fill(`timer-${unique}@playwright.local`);
  await page.getByLabel('Passwort').fill(password);
  await page.getByRole('button', { name: 'Konto erstellen' }).click();
  await expect(page).toHaveURL('/');

  // Lernziel anlegen (Voraussetzung für Timer)
  await page.goto('/goals');
  await page.getByLabel('Titel').fill('Timer-Ziel');
  await page.getByLabel('Modul / Kurs').fill('TMR01');
  await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
  await expect(page.getByText('Timer-Ziel')).toBeVisible();
}

test.describe('Lernzeit-Timer (FR-4)', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await page.goto('/timer');
  });

  test('Session starten — Timer läuft', async ({ page }) => {
    await page.locator('select[name="goal"]').selectOption({ label: 'Timer-Ziel' });
    await page.getByRole('button', { name: '▶ Start' }).click();

    await expect(page.getByText('Timer-Ziel')).toBeVisible();
    await expect(page.getByText('▶ Läuft')).toBeVisible();
    await expect(page.getByRole('button', { name: '⏸ Pause' })).toBeVisible();
  });

  test('Session pausieren und fortsetzen', async ({ page }) => {
    await page.locator('select[name="goal"]').selectOption({ label: 'Timer-Ziel' });
    await page.getByRole('button', { name: '▶ Start' }).click();
    await expect(page.getByText('▶ Läuft')).toBeVisible();

    // Pausieren
    await page.getByRole('button', { name: '⏸ Pause' }).click();
    await expect(page.locator('.timer-status')).toHaveText('⏸ Pausiert');

    // Fortsetzen
    await page.getByRole('button', { name: '▶ Weiter' }).click();
    await expect(page.getByText('▶ Läuft')).toBeVisible();
  });

  test('Session stoppen — erscheint im Verlauf', async ({ page }) => {
    await page.locator('select[name="goal"]').selectOption({ label: 'Timer-Ziel' });
    await page.getByRole('button', { name: '▶ Start' }).click();
    await expect(page.getByText('▶ Läuft')).toBeVisible();

    // Kurz warten damit duration_seconds > 0
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: '⏹ Stopp' }).click();

    // Timer zeigt Start-Screen
    await expect(page.getByRole('button', { name: '▶ Start' })).toBeVisible();

    // Session erscheint in Verlauf
    await expect(page.getByText('Zuletzt gelernt')).toBeVisible();
    await expect(page.locator('.session-row', { hasText: 'Timer-Ziel' })).toBeVisible();
  });
});

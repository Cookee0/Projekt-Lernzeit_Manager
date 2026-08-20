import { test, expect, Page } from '@playwright/test';

const password = 'Sicher123';

// Jeder Testfall registriert ein eigenes Konto (eindeutige E-Mail je Aufruf), damit die Tests
// unabhaengig von Ausfuehrungsreihenfolge und Parallelitaet sind.
async function registerAndLogin(page: Page): Promise<void> {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await page.goto('/register');
  await page.getByLabel('Name').fill(`Goals Tester ${unique}`);
  await page.getByLabel('E-Mail').fill(`goals-${unique}@playwright.local`);
  await page.getByLabel('Passwort').fill(password);
  await page.getByRole('button', { name: 'Konto erstellen' }).click();
  await expect(page).toHaveURL('/');
}

test.describe('Lernziele (FR-1)', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/goals');
  });

  test('Lernziel anlegen', async ({ page }) => {
    const anlegen = page.locator('.card', { hasText: 'Neues Lernziel' });
    await anlegen.getByLabel('Titel').fill('Mathematik I');
    await anlegen.getByLabel('Modul / Kurs').fill('DLBMAMATH01');
    await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();

    await expect(page.getByText('Mathematik I')).toBeVisible();
    await expect(page.getByText('DLBMAMATH01')).toBeVisible();
  });

  test('Lernziel als In Arbeit markieren', async ({ page }) => {
    // Ziel anlegen
    const anlegen = page.locator('.card', { hasText: 'Neues Lernziel' });
    await anlegen.getByLabel('Titel').fill('Statistik');
    await anlegen.getByLabel('Modul / Kurs').fill('STAT01');
    await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
    await expect(page.getByText('Statistik')).toBeVisible();

    // Status auf In Arbeit setzen
    await page.getByRole('button', { name: '▶ In Arbeit' }).first().click();
    await expect(page.getByText('In Arbeit')).toBeVisible();
  });

  test('Lernziel als Erreicht markieren', async ({ page }) => {
    const anlegen = page.locator('.card', { hasText: 'Neues Lernziel' });
    await anlegen.getByLabel('Titel').fill('Englisch B2');
    await anlegen.getByLabel('Modul / Kurs').fill('ENG01');
    await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
    await expect(page.getByText('Englisch B2')).toBeVisible();

    await page.getByRole('button', { name: '✓ Erreicht' }).first().click();
    await expect(page.getByText('Erreicht')).toBeVisible();
  });

  test('Lernziel löschen', async ({ page }) => {
    const anlegen = page.locator('.card', { hasText: 'Neues Lernziel' });
    await anlegen.getByLabel('Titel').fill('Lösch-Test');
    await anlegen.getByLabel('Modul / Kurs').fill('DEL01');
    await page.getByRole('button', { name: 'Ziel hinzufügen' }).click();
    await expect(page.getByText('Lösch-Test')).toBeVisible();

    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '🗑 Löschen' }).first().click();

    await expect(page.getByText('Lösch-Test')).not.toBeVisible();
  });
});
